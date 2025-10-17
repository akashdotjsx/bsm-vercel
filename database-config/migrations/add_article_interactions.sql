-- Migration: Add article interaction tables
-- Description: Adds tables for article bookmarks, comments, votes/reactions, and revision history

-- Article Bookmarks
CREATE TABLE IF NOT EXISTS public.article_bookmarks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  article_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT article_bookmarks_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  CONSTRAINT article_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT article_bookmarks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT article_bookmarks_unique UNIQUE (article_id, user_id)
);

-- Article Comments
CREATE TABLE IF NOT EXISTS public.article_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  article_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  parent_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_comments_pkey PRIMARY KEY (id),
  CONSTRAINT article_comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  CONSTRAINT article_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT article_comments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT article_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.article_comments(id) ON DELETE CASCADE
);

-- Article Votes (likes/dislikes)
CREATE TABLE IF NOT EXISTS public.article_votes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  article_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote_type character varying NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_votes_pkey PRIMARY KEY (id),
  CONSTRAINT article_votes_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  CONSTRAINT article_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT article_votes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT article_votes_unique UNIQUE (article_id, user_id)
);

-- Article History/Revisions
CREATE TABLE IF NOT EXISTS public.article_revisions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  article_id uuid NOT NULL,
  version_number integer NOT NULL,
  title character varying NOT NULL,
  content text NOT NULL,
  summary text,
  change_description text,
  changed_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT article_revisions_pkey PRIMARY KEY (id),
  CONSTRAINT article_revisions_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  CONSTRAINT article_revisions_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id),
  CONSTRAINT article_revisions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT article_revisions_unique UNIQUE (article_id, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS article_bookmarks_user_id_idx ON public.article_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS article_bookmarks_article_id_idx ON public.article_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS article_comments_article_id_idx ON public.article_comments(article_id);
CREATE INDEX IF NOT EXISTS article_comments_user_id_idx ON public.article_comments(user_id);
CREATE INDEX IF NOT EXISTS article_comments_parent_id_idx ON public.article_comments(parent_id);
CREATE INDEX IF NOT EXISTS article_votes_article_id_idx ON public.article_votes(article_id);
CREATE INDEX IF NOT EXISTS article_votes_user_id_idx ON public.article_votes(user_id);
CREATE INDEX IF NOT EXISTS article_revisions_article_id_idx ON public.article_revisions(article_id);

-- Enable RLS
ALTER TABLE public.article_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_bookmarks
CREATE POLICY "Users can view bookmarks in their organization" ON public.article_bookmarks
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create their own bookmarks" ON public.article_bookmarks
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their own bookmarks" ON public.article_bookmarks
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for article_comments
CREATE POLICY "Users can view comments in their organization" ON public.article_comments
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create comments in their organization" ON public.article_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own comments" ON public.article_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON public.article_comments
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for article_votes
CREATE POLICY "Users can view votes in their organization" ON public.article_votes
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create their own votes" ON public.article_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own votes" ON public.article_votes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes" ON public.article_votes
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for article_revisions
CREATE POLICY "Users can view revisions in their organization" ON public.article_revisions
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create revisions in their organization" ON public.article_revisions
  FOR INSERT WITH CHECK (
    changed_by = auth.uid() AND
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );
