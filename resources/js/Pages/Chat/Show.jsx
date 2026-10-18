import PrimaryButton from '@/Components/PrimaryButton';
import PageHeader from '@/Components/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

export default function ChatShow({ conversation, messages }) {
    const threadRef = useRef(null);
    const { data, setData, post, processing, reset } = useForm({ body: '' });

    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [messages.length]);

    useEffect(() => {
        const timer = setInterval(() => {
            router.reload({ only: ['messages'], preserveScroll: true, preserveState: true });
        }, 15000);

        return () => clearInterval(timer);
    }, []);

    const submit = (event) => {
        event.preventDefault();
        post(route('chat.reply', conversation.id), {
            preserveScroll: true,
            onSuccess: () => reset('body'),
        });
    };

    return (
        <AppLayout title={conversation.title}>
            <Head title={conversation.title} />
            <PageHeader
                title={conversation.title}
                description={conversation.description}
                actions={<Link href={route('chat.index')} className="text-sm text-gf-forest">All chats</Link>}
            />

            <section className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div ref={threadRef} className="max-h-[32rem] space-y-3 overflow-y-auto px-4 py-5">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.mine ? 'bg-gf-green text-gf-ink' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
                                {!message.mine && <p className="text-xs font-semibold">{message.sender_name}</p>}
                                <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                                <p className={`mt-1 text-[11px] ${message.mine ? 'text-gf-ink/70' : 'text-slate-400'}`}>{message.created_at}</p>
                            </div>
                        </div>
                    ))}
                    {!messages.length && <p className="text-center text-sm text-slate-500">No messages yet.</p>}
                </div>

                <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
                    <textarea
                        className="min-h-12 flex-1 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                        rows={2}
                        value={data.body}
                        placeholder="Write a message"
                        onChange={(event) => setData('body', event.target.value)}
                    />
                    <PrimaryButton disabled={processing || !data.body.trim()}>Send</PrimaryButton>
                </form>
            </section>
        </AppLayout>
    );
}
