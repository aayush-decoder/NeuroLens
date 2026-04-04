import { useEffect, useState } from 'react';
import { AppState, useColorScheme as useDeviceColorScheme } from 'react-native';

import { loadProfile } from '@/lib/adaptive-store';

type Scheme = 'light' | 'dark';

let latestScheme: Scheme | null = null;
const listeners = new Set<(scheme: Scheme) => void>();

export function setPreferredColorScheme(scheme: Scheme): void {
	latestScheme = scheme;
	listeners.forEach((listener) => listener(scheme));
}

export function useColorScheme(): 'light' | 'dark' {
	const deviceScheme = useDeviceColorScheme() ?? 'light';
	const [profileScheme, setProfileScheme] = useState<Scheme | null>(latestScheme);

	useEffect(() => {
		const syncFromProfile = async () => {
			const profile = await loadProfile();
			const nextScheme: Scheme = profile.darkMode ? 'dark' : 'light';
			latestScheme = nextScheme;
			setProfileScheme(nextScheme);
		};

		void syncFromProfile();

		const sub = AppState.addEventListener('change', (state) => {
			if (state === 'active') {
				void syncFromProfile();
			}
		});

		const listener = (scheme: Scheme) => {
			setProfileScheme(scheme);
		};

		listeners.add(listener);

		return () => {
			listeners.delete(listener);
			sub.remove();
		};
	}, []);

	return profileScheme ?? deviceScheme;
}
