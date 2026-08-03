"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, GripVertical, Images, Pencil, Trash2 } from "lucide-react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { FlipBook } from "@/types/flipbook";
import styles from "./FlipbookCard.module.css";

type Props = {
  fb: FlipBook;
  index: number;
  /** Show edit/delete controls and the draft/public badge. */
  owned?: boolean;
  onDelete?: (fb: FlipBook) => void;
  /** Drag handle props from the dnd library, when the card is reorderable. */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
};

export default function FlipbookCard({
  fb,
  index,
  owned = false,
  onDelete,
  dragHandleProps,
}: Props) {
  const title = fb.title || fb.slug;
  const cover = fb.images?.[0];
  const pages = fb.images?.length ?? 0;
  const published = fb.status === "published";

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.05 }}>
      <Link href={`/flipbook/${fb.slug}`} className={styles.media}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className={styles.thumbnail} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>
            <Images size={20} />
            <span>No pages yet</span>
          </div>
        )}

        <span className={styles.mediaScrim} aria-hidden="true" />

        {owned && (
          <span
            className={published ? styles.badgePublic : styles.badgeDraft}
            data-testid="status-badge">
            {published ? "Public" : "Draft"}
          </span>
        )}

        {pages > 0 && (
          <span className={styles.pageCount}>
            {pages} {pages === 1 ? "page" : "pages"}
          </span>
        )}

        {dragHandleProps && (
          <span
            className={styles.grip}
            aria-label="Drag to reorder"
            onClick={(e) => e.preventDefault()}
            {...dragHandleProps}>
            <GripVertical size={14} />
          </span>
        )}
      </Link>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <Link href={`/flipbook/${fb.slug}`}>{title}</Link>
        </h3>
        <p className={styles.description}>
          {fb.description || "No description yet."}
        </p>
      </div>

      <div className={styles.actions}>
        <Link href={`/flipbook/${fb.slug}`} className={styles.primaryAction}>
          Open
          <ArrowUpRight size={14} />
        </Link>

        {owned && (
          <>
            <Link
              href={`/flipbook/${fb.slug}/edit`}
              className={styles.ghostAction}
              aria-label={`Edit ${title}`}>
              <Pencil size={14} />
              Edit
            </Link>
            <button
              type="button"
              className={styles.dangerAction}
              onClick={() => onDelete?.(fb)}
              aria-label={`Delete ${title}`}>
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </motion.article>
  );
}
