"use client";
import { gql, useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { generateSlug } from "@/lib/slug";
import Loader from "@/components/Loader/Loader";
import SignInPrompt from "@/components/SignInPrompt/SignInPrompt";
import FlipbookForm, {
  defaultFlipbookValues,
  FlipbookFormValues,
} from "@/components/FlipbookForm/FlipbookForm";

const CREATE_FLIPBOOK = gql`
  mutation CreateFlipBook($input: FlipBookInput!) {
    createFlipBook(input: $input)
  }
`;

export default function NewFlipBookPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [createFlipBook] = useMutation(CREATE_FLIPBOOK, {
    // Invalidate cached lists so the new flipbook appears without a hard refresh.
    update: (cache) => {
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

    // Slugs are generated automatically; the user never sets them.
    const slug = generateSlug(values.title);

    await createFlipBook({
      variables: {
        input: {
          slug,
          title: values.title,
          description: values.description,
          images: values.images,
          status: values.published ? "published" : "draft",
          tags: [],
          settings: cleanSettings,
        },
      },
    });

    // FlipbookForm raises its own "saved" toast, and the Toaster lives in the
    // root layout, so it survives this navigation.
    router.push(`/flipbook/${slug}/edit`);
  };

  if (status === "loading") return <Loader />;
  if (!session)
    return <SignInPrompt message="Please sign in to create a flipbook." />;

  return (
    <FlipbookForm
      heading="New flipbook"
      initialValues={defaultFlipbookValues}
      onSubmit={handleSubmit}
    />
  );
}
