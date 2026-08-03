"use client";

import { gql, useQuery } from "@apollo/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageFlipper from "@/components/PageFlipper";
import Loader from "@/components/Loader/Loader";
import styles from "./view.module.css";

const FLIPBOOK_BY_SLUG = gql`
  query FlipBookBySlug($slug: String!) {
    flipBookBySlug(slug: $slug) {
      id
      slug
      title
      description
      images
      settings {
        width
        height
        backgroundColor
        showPageNumbers
      }
    }
  }
`;

export default function FlipBookPage() {
  const { slug } = useParams() as { slug: string };

  const { data, loading, error } = useQuery(FLIPBOOK_BY_SLUG, {
    variables: { slug },
    // Always revalidate against the server so edits show up without a hard refresh.
    fetchPolicy: "cache-and-network",
  });

  // Only block on the first fetch; cache-and-network refetches keep the book
  // on screen rather than flashing the loader over it.
  if (loading && !data) return <Loader />;

  if (error) {
    return (
      <div className={styles.state}>
        <h1 className={styles.stateTitle}>Couldn&apos;t load this flipbook</h1>
        <p className={styles.stateBody}>{error.message}</p>
        <Link href="/" className={styles.stateLink}>
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>
    );
  }

  const flipBook = data?.flipBookBySlug;

  if (!flipBook) {
    return (
      <div className={styles.state}>
        <h1 className={styles.stateTitle}>Flipbook not found</h1>
        <p className={styles.stateBody}>
          Nothing lives at <strong>/{slug}</strong>. It may have been deleted or
          never published.
        </p>
        <Link href="/" className={styles.stateLink}>
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <main className={styles.container}>
      <div className={styles.head}>
        <h1 className={styles.heading}>{flipBook.title}</h1>
        {flipBook.description && (
          <p className={styles.description}>{flipBook.description}</p>
        )}
      </div>

      <div className={styles.stage}>
        <PageFlipper
          images={flipBook.images}
          width={flipBook.settings?.width || 400}
          height={flipBook.settings?.height || 600}
          backgroundColor={flipBook.settings?.backgroundColor || "#701919ff"}
          showPageNumbers={flipBook.settings?.showPageNumbers ?? true}
        />
      </div>
    </main>
  );
}
