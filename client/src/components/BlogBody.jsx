import { parseBlogBlocks, safeHttpUrl } from '../lib/blogMarkup';

function Inline({ parts }) {
  return (parts || []).map((part, i) => {
    if (part.type === 'link') {
      return (
        <a
          key={i}
          href={part.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ember underline underline-offset-2 hover:text-ember-deep"
        >
          {part.label}
        </a>
      );
    }
    return <span key={i}>{part.value}</span>;
  });
}

export default function BlogBody({ content, ctaLabel, ctaUrl }) {
  const blocks = parseBlogBlocks(content);
  const buttonHref = safeHttpUrl(ctaUrl);
  const headingClass = {
    2: 'font-display text-2xl font-bold text-ink mt-10 mb-3',
    3: 'font-display text-xl font-bold text-ink mt-8 mb-2',
    4: 'font-display text-lg font-semibold text-ink mt-6 mb-2',
  };

  return (
    <div className="bd-blog-body space-y-5">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const Tag = `h${block.level}`;
          return (
            <Tag key={i} className={headingClass[block.level] || headingClass[2]}>
              <Inline parts={block.parts} />
            </Tag>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={i} className="bd-blog-quote">
              <Inline parts={block.parts} />
            </blockquote>
          );
        }
        if (block.type === 'button') {
          return (
            <p key={i}>
              <a
                href={block.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-deep"
              >
                {block.label}
              </a>
            </p>
          );
        }
        return (
          <p key={i} className="text-base leading-relaxed text-ink-soft">
            <Inline parts={block.parts} />
          </p>
        );
      })}
      {ctaLabel && buttonHref ? (
        <p className="pt-2">
          <a
            href={buttonHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-deep"
          >
            {ctaLabel}
          </a>
        </p>
      ) : null}
    </div>
  );
}
