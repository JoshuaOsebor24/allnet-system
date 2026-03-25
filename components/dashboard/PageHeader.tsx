import Link from "next/link";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/app/ui";

type HeaderAction = {
  label: string;
  variant?: "primary" | "secondary";
} & (
  | {
      href: string;
      onClick?: never;
    }
  | {
      href?: never;
      onClick: () => void;
    }
);

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: HeaderAction[];
};

export default function PageHeader({
  title,
  description,
  actions = [],
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) =>
            "href" in action ? (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href as string}
                className={
                  action.variant === "secondary"
                    ? secondaryButtonClass
                    : primaryButtonClass
                }
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={
                  action.variant === "secondary"
                    ? secondaryButtonClass
                    : primaryButtonClass
                }
              >
                {action.label}
              </button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
