import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { User, Globe, Target, BookOpen, Save, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    preferred_language: 'en',
    reading_goal_minutes: 30,
  });

  React.useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        preferred_language: profile.preferred_language || 'en',
        reading_goal_minutes: profile.reading_goal_minutes || 30,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile(form);
    if (result?.error) {
      toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const initials = form.display_name
    ? form.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <DashboardLayout title="Profile">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 backdrop-blur-xl p-6 sm:p-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Personal settings</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
                <p className="mt-2 text-muted-foreground">
                  Keep your reading preferences and identity aligned with the rest of the dashboard experience.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </button>
          </div>
        </motion.section>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Avatar section */}
          <div className="dashboard-card p-6 sm:p-7 flex items-center gap-5 bg-card/80 backdrop-blur-md">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{form.display_name || 'Set your name'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Form */}
          <div className="dashboard-card p-6 sm:p-7 space-y-5 bg-card/80 backdrop-blur-md">
            <div>
              <Label htmlFor="name" className="text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Display Name
              </Label>
              <Input
                id="name"
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                className="mt-1.5"
                placeholder="Your display name"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" /> Bio
              </Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="mt-1.5"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lang" className="text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" /> Preferred Language
                </Label>
                <select
                  id="lang"
                  value={form.preferred_language}
                  onChange={e => setForm(f => ({ ...f, preferred_language: e.target.value }))}
                  className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
              <div>
                <Label htmlFor="goal" className="text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" /> Daily Goal (min)
                </Label>
                <Input
                  id="goal"
                  type="number"
                  value={form.reading_goal_minutes}
                  onChange={e => setForm(f => ({ ...f, reading_goal_minutes: parseInt(e.target.value) || 0 }))}
                  className="mt-1.5"
                  min={5}
                  max={480}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={handleSignOut} className="text-destructive border-destructive/30 hover:bg-destructive/5">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

function LogOut(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
}
