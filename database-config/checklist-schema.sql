-- Checklist/Task management for tickets
CREATE TABLE public.ticket_checklist (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL,
  text text NOT NULL,
  completed boolean DEFAULT false,
  assignee_id uuid,
  due_date timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ticket_checklist_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_checklist_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE,
  CONSTRAINT ticket_checklist_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id),
  CONSTRAINT ticket_checklist_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Index for better performance
CREATE INDEX idx_ticket_checklist_ticket_id ON public.ticket_checklist(ticket_id);
CREATE INDEX idx_ticket_checklist_assignee_id ON public.ticket_checklist(assignee_id);
CREATE INDEX idx_ticket_checklist_completed ON public.ticket_checklist(completed);
