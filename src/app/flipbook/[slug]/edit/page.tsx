"use client";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Loader from "@/components/Loader/Loader";
import SignInPrompt from "@/components/SignInPrompt/SignInPrompt";

import FlipbookForm, {
  defaultFlipbookValues,
  FlipbookFormValues,
} from "@/components/FlipbookForm/FlipbookForm";

const FLIPBOOK_BY_SLUG = gql`
  query FlipBookBySlug($slug: String!) {
    flipBookBySlug(slug: $slug) {
      id
      slug
      title
      description
      images
      status
      userEmail
      settings {
        width
        height
        size
        minWidth
        maxWidth
        minHeight
        maxHeight
        drawShadow
        flippingTime
        usePortrait
        startZIndex
        autoSize
        maxShadowOpacity
        showCover
        mobileScrollSupport
        backgroundColor
        showPageNumbers
        swipeDistance
        showPageCorners
        disableFlipByClick
        useMouseEvents
      }
    }
  }
`;

const UPDATE_FLIPBOOK = gql`
  mutation UpdateFlipBook($id: ID!, $input: FlipBookInput!) {
    updateFlipBook(id: $id, input: $input)
  }
`;

const DELETE_FLIPBOOK = gql`
  mutation DeleteFlipBook($id: ID!) {
    deleteFlipBook(id: $id)
  }
`;

export default function EditFlipBookPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const { data, loading, error } = useQuery(FLIPBOOK_BY_SLUG, {
    variables: { slug },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const [updateFlipBook] = useMutation(UPDATE_FLIPBOOK, {
    // Invalidate the cached lists so the home page reflects edits; the view page
    // uses cache-and-network so it always refetches on its own.
    update: (cache) => {
      cache.evict({ fieldName: "flipBooks" });
      cache.evict({ fieldName: "myFlipbooks" });
      cache.gc();
    },
  });

  const [deleteFlipBook] = useMutation(DELETE_FLIPBOOK, {
    update: (cache) => {
      cache.evict({ fieldName: "flipBookBySlug" });
      cache.evict({ fieldName: "flipBooks" });
      cache.evict({ fieldName: "myFlipbooks" });
      cache.gc();
    },
  });

  const handleSubmit = async (values: FlipbookFormValues) => {
    const cleanSettings = values.settings
      ? {
          width: values.settings.width,
          height: values.settings.height,
          size: values.settings.size,
          minWidth: values.settings.minWidth,
          maxWidth: values.settings.maxWidth,
          minHeight: values.settings.minHeight,
          maxHeight: values.settings.maxHeight,
          drawShadow: values.settings.drawShadow,
          flippingTime: values.settings.flippingTime,
          usePortrait: values.settings.usePortrait,
          startZIndex: values.settings.startZIndex,
          autoSize: values.settings.autoSize,
          maxShadowOpacity: values.settings.maxShadowOpacity,
          showCover: values.settings.showCover,
          mobileScrollSupport: values.settings.mobileScrollSupport,
          showPageNumbers: values.settings.showPageNumbers,
          swipeDistance: values.settings.swipeDistance,
          showPageCorners: values.settings.showPageCorners,
          disableFlipByClick: values.settings.disableFlipByClick,
          useMouseEvents: values.settings.useMouseEvents,
        }
      : undefined;

    await updateFlipBook({
      variables: {
        id: flipBook.id,
        input: {
          slug: values.slug,
          title: values.title,
          description: values.description,
          images: [...values.images],
          status: values.published ? "published" : "draft",
          tags: [],
          settings: cleanSettings,
        },
      },
    });
  };

  if (loading || authStatus === "loading") return <Loader />;
  if (!session)
    return <SignInPrompt message="Please sign in to edit flipbooks." />;
  if (error)
    return (
      <SignInPrompt
        title="Couldn't load this flipbook"
        message={error.message}
        showSignIn={false}
      />
    );

  const flipBook = data?.flipBookBySlug;

  if (!flipBook)
    return (
      <SignInPrompt
        title="Flipbook not found"
        message="This flipbook may have been deleted, or the link is wrong."
        showSignIn={false}
      />
    );

  // You can only edit your own flipbooks (legacy ownerless ones are claimable).
  if (flipBook.userEmail && flipBook.userEmail !== session.user?.email) {
    return (
      <SignInPrompt
        title="Not your flipbook"
        message="You can only edit flipbooks you created."
        showSignIn={false}
      />
    );
  }

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete "${flipBook.title || flipBook.slug}"? This permanently removes the flipbook and its uploaded images. This can't be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteFlipBook({ variables: { id: flipBook.id } });
      toast.success("Flipbook deleted.");
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        /not authenticated/i.test(msg)
          ? "Please sign in to delete this flipbook."
          : /not authorized/i.test(msg)
            ? "You can only delete flipbooks you created."
            : "Couldn't delete the flipbook. Please try again.",
      );
    }
  };

  return (
    <FlipbookForm
      heading={flipBook.title || flipBook.slug}
      initialValues={{
        slug: flipBook.slug,
        title: flipBook.title,
        description: flipBook.description || "",
        images: flipBook.images || [],
        published: flipBook.status === "published",
        settings: flipBook.settings || defaultFlipbookValues.settings,
      }}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}
