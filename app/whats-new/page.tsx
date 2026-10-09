import Link from "next/link";
import { fontWeights } from "@/lib/font-weight";
import {
  updates,
  updateHref,
  updateKind,
  STATUS_DOT,
  type IsoDate,
  type UpdateEntry,
  type UpdateKind,
} from "@/lib/docs/updates";
import { DismissAnnouncementOnVisit } from "@/app/whats-new/dismiss-announcement";

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function StatusDot({ kind }: { kind: UpdateKind }) {
  return (
    <span
      className={`inline-block size-1.5 shrink-0 rounded-full ${STATUS_DOT[kind]}`}
      aria-hidden
    />
  );
}

function Legend() {
  return (
    <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 list-none m-0 p-0 text-site-caption text-muted-foreground">
      <li className="flex items-center gap-2">
        <StatusDot kind="New" />
        <span>New — a component or system that just landed</span>
      </li>
      <li className="flex items-center gap-2">
        <StatusDot kind="Updated" />
        <span>Updated — a change to something already here</span>
      </li>
      <li className="flex items-center gap-2">
        <StatusDot kind="Breaking" />
        <span>Breaking — an API change that needs a migration</span>
      </li>
    </ul>
  );
}

type DateGroup = { date: IsoDate; entries: UpdateEntry[] };

/** Group newest-first updates by calendar day (preserves entry order). */
function groupByDate(entries: readonly UpdateEntry[]): DateGroup[] {
  const groups: DateGroup[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) {
      last.entries.push(entry);
    } else {
      groups.push({ date: entry.date, entries: [entry] });
    }
  }
  return groups;
}

export default function WhatsNewPage() {
  const groups = groupByDate(updates);

  return (
    <div className="py-20 sm:py-28 w-full max-w-[680px] mx-auto mt-12 lg:mt-0">
      <DismissAnnouncementOnVisit />
      <div className="flex flex-col gap-8 px-6">
        <div>
          <h1
            className="text-site-display text-foreground leading-none mb-2"
            style={{ fontVariationSettings: fontWeights.bold }}
          >
            What&apos;s New
          </h1>
          <p className="text-site-body text-muted-foreground">
            Recent changes across the registry and docs. The same dots appear in
            the sidebar.
          </p>
          <Legend />
        </div>

        <ol className="flex flex-col gap-10 list-none m-0 p-0">
          {groups.map((group) => (
            <li key={group.date} className="flex flex-col gap-6">
              <time
                dateTime={group.date}
                className="text-site-caption text-muted-foreground tabular-nums"
              >
                {formatDate(group.date)}
              </time>
              <ol className="flex flex-col gap-6 list-none m-0 p-0">
                {group.entries.map((entry) => {
                  const kind = updateKind(entry);
                  return (
                    <li key={entry.id} className="flex flex-col gap-2">
                      <h2
                        className="flex items-center gap-2 text-site-title text-foreground leading-none"
                        style={{ fontVariationSettings: fontWeights.semibold }}
                      >
                        <Link
                          href={updateHref(entry)}
                          className="outline-none transition-colors duration-80 hover:text-foreground/80 focus-visible:shadow-[inset_0_0_0_1px_var(--focus-ring,#6B97FF)]"
                        >
                          {entry.title}
                        </Link>
                        <StatusDot kind={kind} />
                        <span className="sr-only">{kind}</span>
                      </h2>
                      <p className="text-site-body text-muted-foreground">
                        {entry.description}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
