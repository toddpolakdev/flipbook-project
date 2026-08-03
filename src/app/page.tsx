"use client";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { ArrowRight, BookOpen, Images, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import styles from "./home.module.css";
import { FlipBook } from "@/types/flipbook";
import FlipbookCard from "@/components/FlipbookCard/FlipbookCard";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PUBLIC_FLIPBOOKS, MY_FLIPBOOKS } from "./graphql/queries";

const REORDER_FLIPBOOKS = gql`
  mutation ReorderFlipBooks($ids: [ID!]!) {
    reorderFlipBooks(ids: $ids)
  }
`;

const DELETE_FLIPBOOK = gql`
  mutation DeleteFlipBook($id: ID!) {
    deleteFlipBook(id: $id)
  }
`;

export default function HomePage() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? null;

  const { data: publicData, loading: publicLoading } = useQuery(
    PUBLIC_FLIPBOOKS,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: myData, loading: myLoading } = useQuery(MY_FLIPBOOKS, {
    fetchPolicy: "cache-and-network",
    skip: !email,
  });

  const [myFlipbooks, setMyFlipbooks] = useState<FlipBook[]>([]);
  const [reorderFlipBooks] = useMutation(REORDER_FLIPBOOKS);
  const [deleteFlipBook] = useMutation(DELETE_FLIPBOOK);

  useEffect(() => {
    if (myData?.myFlipbooks) setMyFlipbooks(myData.myFlipbooks);
  }, [myData]);

  // Published flipbooks from everyone, minus the ones I own (shown in "yours").
  const publicList: FlipBook[] = (publicData?.flipBooks ?? []).filter(
    (fb: FlipBook) => !email || fb.userEmail !== email,
  );

  // Only block the grid on the very first fetch; background refetches from
  // cache-and-network should never blank out content already on screen.
  const publicFirstLoad = publicLoading && !publicData;
  const myFirstLoad = myLoading && !myData;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const reordered = Array.from(myFlipbooks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setMyFlipbooks(reordered);

    await reorderFlipBooks({ variables: { ids: reordered.map((fb) => fb.id) } });
  };

  const handleDelete = async (fb: FlipBook) => {
    if (
      !window.confirm(
        `Delete "${fb.title || fb.slug}"? This permanently removes the flipbook and its uploaded images.`,
      )
    ) {
      return;
    }

    const previous = myFlipbooks;
    setMyFlipbooks((prev) => prev.filter((f) => f.id !== fb.id));

    try {
      await deleteFlipBook({ variables: { id: fb.id } });
      toast.success("Flipbook deleted.");
    } catch (err) {
      setMyFlipbooks(previous);
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        /not authenticated/i.test(msg)
          ? "Please sign in to delete flipbooks."
          : /not authorized/i.test(msg)
            ? "You can only delete flipbooks you created."
            : "Couldn't delete the flipbook. Please try again.",
      );
    }
  };

  /* ---------------------------------------------------------------- signed in */
  if (session) {
    const published = myFlipbooks.filter(
      (fb) => fb.status === "published",
    ).length;
    const pages = myFlipbooks.reduce(
      (sum, fb) => sum + (fb.images?.length ?? 0),
      0,
    );
    const firstName = session.user?.name?.split(" ")[0];

    return (
      <main className={styles.container}>
        <section className={styles.dashHead}>
          <div>
            <h1 className={styles.dashTitle}>
              {firstName ? `Welcome back, ${firstName}` : "Your flipbooks"}
            </h1>
            <p className={styles.dashSub}>
              Drag a card to reorder. Changes save automatically.
            </p>
          </div>
          <Link href="/flipbook/new" className={styles.btnPrimary}>
            <Plus size={16} />
            New flipbook
          </Link>
        </section>

        <section className={styles.stats}>
          <Stat label="Flipbooks" value={myFlipbooks.length} icon={<BookOpen size={13} />} />
          <Stat label="Published" value={published} icon={<Sparkles size={13} />} />
          <Stat label="Drafts" value={myFlipbooks.length - published} icon={<Images size={13} />} />
          <Stat label="Total pages" value={pages} icon={<Images size={13} />} />
        </section>

        <SectionHeading title="Your flipbooks" count={myFlipbooks.length} />

        {myFirstLoad ? (
          <SkeletonGrid count={3} />
        ) : myFlipbooks.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <BookOpen size={20} />
            </span>
            <h3>No flipbooks yet</h3>
            <p>
              Upload a set of images and Flipbook turns them into a book you can
              share with a link.
            </p>
            <Link href="/flipbook/new" className={styles.btnPrimary}>
              <Plus size={16} />
              Create your first flipbook
            </Link>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="myFlipbooks" direction="horizontal">
              {(provided) => (
                <div
                  className={styles.grid}
                  ref={provided.innerRef}
                  {...provided.droppableProps}>
                  {myFlipbooks.map((fb, i) => (
                    <Draggable key={fb.id} draggableId={fb.id} index={i}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          data-dragging={snapshot.isDragging}
                          className={styles.draggable}>
                          <FlipbookCard
                            fb={fb}
                            index={i}
                            owned
                            onDelete={handleDelete}
                            dragHandleProps={dragProvided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {publicList.length > 0 && (
          <>
            <SectionHeading
              title="Published by others"
              count={publicList.length}
            />
            <div className={styles.grid}>
              {publicList.map((fb, i) => (
                <FlipbookCard key={fb.id} fb={fb} index={i} />
              ))}
            </div>
          </>
        )}
      </main>
    );
  }

  /* --------------------------------------------------------------- signed out */
  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <span className={styles.pill}>
          <span className={styles.pillDot} aria-hidden="true" />
          Images in, flipbook out
        </span>

        <h1 className={styles.heroTitle}>
          Turn your images into a{" "}
          <span className={styles.gradientText}>flipbook</span> worth sharing
        </h1>

        <p className={styles.heroSub}>
          Upload a set of pages, tune the flip physics, and publish. Anyone with
          the link gets a real page-turning book in the browser — no plugin, no
          download.
        </p>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => signIn("google")}>
            Get started free
            <ArrowRight size={16} />
          </button>
          <a href="#gallery" className={styles.btnSecondary}>
            Browse flipbooks
          </a>
        </div>

        <ul className={styles.heroFeatures}>
          <li>Drag-and-drop page ordering</li>
          <li>Hosted image uploads</li>
          <li>Share with a single link</li>
        </ul>
      </section>

      <section id="gallery" className={styles.gallery}>
        <SectionHeading
          title="Published flipbooks"
          count={publicFirstLoad ? undefined : publicList.length}
        />

        {publicFirstLoad ? (
          <SkeletonGrid count={6} />
        ) : publicList.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Images size={20} />
            </span>
            <h3>Nothing published yet</h3>
            <p>Be the first — sign in and publish a flipbook.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {publicList.map((fb, i) => (
              <FlipbookCard key={fb.id} fb={fb} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* -------------------------------------------------------------------------- */

function SectionHeading({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{title}</h2>
      {count !== undefined && <span className={styles.count}>{count}</span>}
      <span className={styles.rule} aria-hidden="true" />
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>
        {icon}
        {label}
      </span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonMedia} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLineShort} />
          </div>
        </div>
      ))}
    </div>
  );
}
