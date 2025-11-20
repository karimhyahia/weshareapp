import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { CardData } from '../types';
import { WebPreview } from './WebPreview';
import { Loader2 } from 'lucide-react';

export const PublicProfile: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const [data, setData] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!username) return;

            try {
                // Fetch by slug using secure RPC function
                const { data: sites, error } = await supabase
                    .rpc('get_site_by_slug', { slug_input: username });

                if (error) throw error;

                const site = sites && sites.length > 0 ? sites[0] : null;

                if (site) {
                    setData(site.data);
                } else {
                    setError('Profile not found');
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Profile not found');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">404</h1>
                <p>{error || 'Profile not found'}</p>
            </div>
        );
    }

    return (
        <WebPreview data={data} />
    );
};
