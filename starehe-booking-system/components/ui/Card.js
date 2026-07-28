import clsx from 'clsx';

export default function Card({ children, className, hoverable = false, ...props }) {
  return (
    <div
      className={clsx(
        'card p-6',
        hoverable && 'hover:-translate-y-0.5 hover:shadow-card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
