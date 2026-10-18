import PageHeader, { HeaderLink } from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

export default function ChatIndex({ conversations }) {
    useEffect(() => {
        const timer = setInterval(() => {
            router.reload({ only: ['conversations'], preserveScroll: true, preserveState: true });
        }, 15000);

        return () => clearInterval(timer);
    }, []);

    return (
        <AppLayout title="Chat">
            <Head title="Chat" />
            <PageHeader
                title="Chat"
                description="Message one person, or everyone in a department."
                actions={<HeaderLink href={route('chat.create')}>New message</HeaderLink>}
            />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                {conversations.length ? (
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {conversations.map((conversation) => (
                            <li key={conversation.id}>
                                <Link href={route('chat.show', conversation.id)} className="flex items-start justify-between gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate font-semibold">{conversation.title}</p>
                                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                                                {conversation.type === 'department' ? 'Department' : 'Person'}
                                            </span>
                                        </div>
                                        <p className="mt-1 truncate text-sm text-slate-500">
                                            {conversation.preview
                                                ? `${conversation.sender_name ? `${conversation.sender_name}: ` : ''}${conversation.preview}`
                                                : 'No messages yet'}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs text-slate-400">{conversation.updated_at}</p>
                                        {conversation.unread > 0 && (
                                            <span className="mt-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-gf-red px-1.5 text-[11px] font-bold text-white">
                                                {conversation.unread}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="px-4 py-12 text-center text-sm text-slate-500">No conversations yet. Send a message to a person or a department.</p>
                )}
            </div>
        </AppLayout>
    );
}
