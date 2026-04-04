"""
Authentication module for the Adaptive Reader extension backend.
Stores users in DynamoDB (table: 'ar_users', partition key: user_id).
Issues signed JWT access tokens (HS256, 7-day expiry).
"""

import os
import uuid
from datetime import datetime, timedelta, UTC
from typing import Optional

import bcrypt
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr

# ─── Config ──────────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7
DYNAMO_TABLE = os.getenv("DYNAMO_TABLE", "ar_users")
AWS_REGION = os.getenv("AWS_REGION", "eu-north-1")

# ─── DynamoDB client ─────────────────────────────────────────────────────────
_dynamo = boto3.resource(
    "dynamodb",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)
_table = _dynamo.Table(DYNAMO_TABLE)

# ─── Router + bearer scheme ──────────────────────────────────────────────────
router = APIRouter(prefix="/api/auth", tags=["auth"])
_bearer = HTTPBearer()


# ─── Schemas ─────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    email: str


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(user_id: str, email: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "username": username,
        "exp": datetime.now(UTC) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def _get_user_by_email(email: str) -> Optional[dict]:
    resp = _table.scan(FilterExpression=Attr("email").eq(email))
    items = resp.get("Items", [])
    return items[0] if items else None


def _get_user_by_username(username: str) -> Optional[dict]:
    resp = _table.scan(FilterExpression=Attr("username").eq(username))
    items = resp.get("Items", [])
    return items[0] if items else None


# ─── Dependency: current user ────────────────────────────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    return _decode_token(credentials.credentials)


# ─── Endpoints ───────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest):
    if _get_user_by_email(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if _get_user_by_username(req.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user_id = str(uuid.uuid4())
    item = {
        "user_id": user_id,
        "username": req.username,
        "email": req.email,
        "password": _hash_password(req.password),
        "reading_level": None,
        "preferred_lang": None,
        "fatigue_score": 0,
        "created_at": datetime.now(UTC).isoformat(),
    }

    try:
        _table.put_item(Item=item)
    except ClientError as exc:
        raise HTTPException(status_code=500, detail="Failed to create user") from exc

    token = _create_token(user_id, req.email, req.username)
    return TokenResponse(access_token=token, user_id=user_id, username=req.username, email=req.email)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    user = _get_user_by_email(req.email)
    if not user or not _verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_token(user["user_id"], user["email"], user["username"])
    return TokenResponse(
        access_token=token,
        user_id=user["user_id"],
        username=user["username"],
        email=user["email"],
    )


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    user = _get_user_by_email(current_user["email"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user["email"],
        "reading_level": user.get("reading_level"),
        "preferred_lang": user.get("preferred_lang"),
        "fatigue_score": user.get("fatigue_score", 0),
        "created_at": user.get("created_at"),
    }
