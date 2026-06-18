-- ========================================================
-- DARKLEAKER Database Schema
-- Paste this script into your Supabase SQL Editor.
-- ========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Stores user account info with role-based permissions: 'user', 'admin', 'owner'
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    discord_id VARCHAR(100),
    is_premium BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user' NOT NULL, -- 'user', 'admin', 'owner'
    is_banned BOOLEAN DEFAULT FALSE,
    banned_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT val_role CHECK (role IN ('user', 'admin', 'owner'))
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (NOT is_banned OR (auth.uid() = id));

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Owners can update any profile" 
ON public.profiles FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'owner'
    )
);

-- 2. RESOURCES TABLE
-- Stores uploaded Minecraft marketplace resources
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'plugin', 'skript', 'config', 'map', 'setup', 'resource_pack', 'other'
    tags TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    mediafire_url TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0 NOT NULL,
    downloads INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT val_status CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT val_category CHECK (category IN ('plugin', 'skript', 'config', 'map', 'setup', 'resource_pack', 'other'))
);

-- Enable RLS for Resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Resources RLS Policies
CREATE POLICY "Approved resources are viewable by everyone" 
ON public.resources FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Authors can view their own pending/rejected resources" 
ON public.resources FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all resources" 
ON public.resources FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'owner')
    )
);

CREATE POLICY "Authenticated users can create resources" 
ON public.resources FOR INSERT 
WITH CHECK (
    auth.uid() = author_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.is_banned = FALSE
    )
);

CREATE POLICY "Authors can update their own pending resources" 
ON public.resources FOR UPDATE 
USING (
    auth.uid() = author_id AND 
    status = 'pending'
);

CREATE POLICY "Admins can update any resource" 
ON public.resources FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'owner')
    )
);

CREATE POLICY "Authors can delete their own resources" 
ON public.resources FOR DELETE 
USING (
    auth.uid() = author_id
);

CREATE POLICY "Admins can delete any resource" 
ON public.resources FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'owner')
    )
);

-- 3. REVIEWS TABLE
-- Stores ratings and feedback for resources
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_resource_user_review UNIQUE (resource_id, user_id)
);

-- Enable RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews RLS Policies
CREATE POLICY "All reviews are viewable by everyone" 
ON public.reviews FOR SELECT 
USING (TRUE);

CREATE POLICY "Authenticated users can write reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.is_banned = FALSE
    )
);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any review" 
ON public.reviews FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'owner')
    )
);

-- 4. DOWNLOAD LOGS TABLE (For Realtime Performance Analytics)
CREATE TABLE IF NOT EXISTS public.download_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Download Logs
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

-- Download Logs RLS Policies
CREATE POLICY "Download logs are readable by everyone"
ON public.download_logs FOR SELECT
USING (TRUE);

CREATE POLICY "Anyone can insert download logs"
ON public.download_logs FOR INSERT
WITH CHECK (TRUE);

-- 5. AUDIT LOGS TABLE
-- Tracks critical activities (admin actions, premium grants, bans)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL, -- 'ban_user', 'unban_user', 'grant_premium', 'revoke_premium', 'approve_resource', 'reject_resource', 'create_resource'
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit Logs RLS Policies
CREATE POLICY "Everyone can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (TRUE);

CREATE POLICY "Anyone can insert audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (TRUE);

-- 6. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for System Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- System Settings RLS Policies
CREATE POLICY "System settings are viewable by everyone" 
ON public.system_settings FOR SELECT 
USING (TRUE);

CREATE POLICY "Admins can modify system settings" 
ON public.system_settings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'owner')
    )
);

-- ========================================================
-- INDEXES FOR HIGH PERFORMANCE
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_is_featured ON public.resources(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_resource ON public.reviews(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_download_logs_resource ON public.download_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_time ON public.download_logs(downloaded_at);

-- ========================================================
-- AUTOMATION & TRIGGERS
-- ========================================================

-- Trigger to automate profiles creation upon Supabase user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    role_val VARCHAR(20) := 'user';
    discord_id_val VARCHAR(100);
BEGIN
    discord_id_val := new.raw_user_meta_data->>'providers'->'discord'->>'id';
    IF discord_id_val = '382103405908230144' THEN
        role_val := 'owner';
    END IF;

    INSERT INTO public.profiles (id, username, avatar_url, discord_id, is_premium, role, is_banned)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'custom_claims'->>'username', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        discord_id_val,
        discord_id_val = '382103405908230144',
        role_val,
        FALSE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to handle automated updated_at timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
