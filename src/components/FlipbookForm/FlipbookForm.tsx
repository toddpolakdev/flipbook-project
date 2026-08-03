"use client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useMemo } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  Accordion,
  ActionIcon,
  Button,
  Card,
  FileButton,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  BookOpenText,
  FileText,
  GripVertical,
  Images,
  Link as LinkIcon,
  PlayCircle,
  Save,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import PageFlipper from "../PageFlipper";
import { toast } from "sonner";
import styles from "./FlipbookForm.module.css";
import { uploadImage, extractCloudinaryPublicId } from "@/lib/uploadImage";

const DELETE_IMAGE = gql`
  mutation DeleteImage($publicId: String!) {
    deleteImage(publicId: $publicId)
  }
`;

type Page = { id: string; url: string };

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export interface FlipbookFormValues {
  slug: string;
  title: string;
  description: string;
  images: string[];
  published: boolean;
  settings: {
    width: number;
    height: number;
    size: "fixed" | "stretch";
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    startZIndex: number;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    showPageNumbers: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
    useMouseEvents: boolean;
  };
}

interface Props {
  initialValues: FlipbookFormValues;
  onSubmit: (values: FlipbookFormValues) => Promise<void>;
  heading?: string;
  onDelete?: () => void | Promise<void>;
}

export default function FlipbookForm({
  initialValues,
  onSubmit,
  heading = "Flipbook editor",
  onDelete,
}: Props) {
  const [form, setForm] = useState<FlipbookFormValues>(initialValues);
  const [pages, setPages] = useState<Page[]>(() =>
    initialValues.images.map((url) => ({ id: newId(), url })),
  );
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  const [deleteImage] = useMutation(DELETE_IMAGE);

  const images = pages.map((p) => p.url);
  const pageLabel = pages.length === 1 ? "page" : "pages";

  const flipbookKey = useMemo(() => {
    const {
      width,
      height,
      size,
      flippingTime,
      usePortrait,
      autoSize,
      showCover,
    } = form.settings;
    return `${width}-${height}-${size}-${flippingTime}-${usePortrait}-${autoSize}-${showCover}`;
  }, [form.settings]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (name: string, value: any) => {
    if (name in form.settings) {
      setForm({
        ...form,
        settings: {
          ...form.settings,
          [name]: value,
        },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const renderSwitch = (
    label: string,
    key: keyof FlipbookFormValues["settings"],
  ) => (
    <Switch
      classNames={{
        track: styles.myTrack,
        thumb: styles.myThumb,
        label: styles.myLabel,
      }}
      label={label}
      checked={form.settings[key] as boolean}
      onChange={(e) => handleChange(key, e.currentTarget.checked)}
    />
  );

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;

    let valid = false;
    try {
      const parsed = new URL(url);
      valid = parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      valid = false;
    }
    if (!valid) {
      toast.error("Enter a valid image URL starting with http:// or https://");
      return;
    }

    setPages((prev) => [...prev, { id: newId(), url }]);
    setUrlInput("");
  };

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);

    const uploaded: Page[] = [];
    for (const file of files) {
      try {
        const url = await uploadImage(file);
        uploaded.push({ id: newId(), url });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : `Couldn't upload ${file.name}`,
        );
      }
    }

    if (uploaded.length) {
      setPages((prev) => [...prev, ...uploaded]);
      toast.success(
        `Uploaded ${uploaded.length} image${uploaded.length > 1 ? "s" : ""}.`,
      );
    }
    setUploading(false);
  };

  const updatePageUrl = (id: string, url: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, url } : p)));
  };

  const removePage = async (id: string, url: string) => {
    if (
      !window.confirm(
        "Delete this image? It will be removed from the flipbook and permanently deleted from storage.",
      )
    ) {
      return;
    }

    setPages((prev) => prev.filter((p) => p.id !== id));

    const publicId = extractCloudinaryPublicId(url);
    if (publicId) {
      try {
        await deleteImage({ variables: { publicId } });
      } catch {
        toast.error(
          "Removed from the flipbook, but the file couldn't be deleted from storage.",
        );
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setTitleError("Title is required.");
      toast.error("Please add a title before saving.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        title: trimmedTitle,
        images: pages.map((p) => p.url),
      });
      toast.success("Flipbook saved!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editor}>
      {/* Sticky action header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>{heading}</h1>
          <div className={styles.headerMeta}>
            {pages.length} {pageLabel}
            {form.slug ? ` · /${form.slug}` : ""}
          </div>
        </div>
        <Group gap="sm">
          {onDelete && (
            <Button
              type="button"
              variant="light"
              color="red"
              leftSection={<Trash2 size={16} />}
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
          <Button
            type="submit"
            loading={saving}
            leftSection={<Save size={16} />}
          >
            Save flipbook
          </Button>
        </Group>
      </div>

      <div className={styles.workspace}>
        {/* Left toolbar — content */}
        <aside className={styles.panel}>
          <Accordion multiple defaultValue={["details", "pages"]}>
            <Accordion.Item value="details">
              <Accordion.Control icon={<FileText size={16} />}>
                Details
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <TextInput
                    label="Title"
                    required
                    withAsterisk
                    error={titleError}
                    value={form.title}
                    onChange={(e) => {
                      handleChange("title", e.currentTarget.value);
                      if (titleError) setTitleError(null);
                    }}
                  />
                  <Textarea
                    label="Description"
                    minRows={3}
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.currentTarget.value)
                    }
                  />
                  <Switch
                    classNames={{
                      track: styles.myTrack,
                      thumb: styles.myThumb,
                      label: styles.myLabel,
                    }}
                    label="Show on main page"
                    description="When on, anyone can view this flipbook on the home page."
                    checked={form.published}
                    onChange={(e) =>
                      handleChange("published", e.currentTarget.checked)
                    }
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="pages">
              <Accordion.Control icon={<Images size={16} />}>
                Pages
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  {/* Upload from device */}
                  <FileButton onChange={handleUpload} accept="image/*" multiple>
                    {(props) => (
                      <Button
                        {...props}
                        fullWidth
                        variant="light"
                        leftSection={<Upload size={16} />}
                        loading={uploading}
                      >
                        Upload images
                      </Button>
                    )}
                  </FileButton>
                  <Text size="xs" c="dimmed" ta="center" mt={-8}>
                    PNG, JPG, GIF or WEBP up to 10&nbsp;MB
                  </Text>

                  {/* Add by URL */}
                  <Group align="flex-end" gap="xs" wrap="nowrap">
                    <TextInput
                      style={{ flex: 1 }}
                      label="Add image by URL"
                      placeholder="https://example.com/page.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addUrl();
                        }
                      }}
                    />
                    <Button
                      variant="light"
                      leftSection={<LinkIcon size={16} />}
                      onClick={addUrl}
                    >
                      Add
                    </Button>
                  </Group>

                  {/* Page list */}
                  {pages.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="md">
                      No pages yet — upload images or add one by URL to get
                      started.
                    </Text>
                  ) : (
                    <DragDropContext
                      onDragEnd={(result) => {
                        if (!result.destination) return;
                        const destination = result.destination;
                        setPages((prev) => {
                          const next = Array.from(prev);
                          const [moved] = next.splice(result.source.index, 1);
                          next.splice(destination.index, 0, moved);
                          return next;
                        });
                      }}
                    >
                      <Droppable droppableId="pages">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {pages.map((page, idx) => (
                              <Draggable
                                key={page.id}
                                draggableId={page.id}
                                index={idx}
                              >
                                {(provided) => (
                                  <Card
                                    shadow="xs"
                                    padding="xs"
                                    mb="xs"
                                    withBorder
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                  >
                                    <div className={styles.pageRow}>
                                      <div
                                        className={styles.dragHandle}
                                        {...provided.dragHandleProps}
                                        aria-label="Drag to reorder"
                                      >
                                        <GripVertical size={18} />
                                      </div>
                                      <div className={styles.pageThumb}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={page.url} alt="" />
                                      </div>
                                      <TextInput
                                        style={{ flex: 1 }}
                                        size="xs"
                                        label={`Page ${idx + 1}`}
                                        value={page.url}
                                        onChange={(e) =>
                                          updatePageUrl(
                                            page.id,
                                            e.currentTarget.value,
                                          )
                                        }
                                      />
                                      <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        size="lg"
                                        mt="lg"
                                        onClick={() =>
                                          removePage(page.id, page.url)
                                        }
                                        aria-label={`Delete page ${idx + 1}`}
                                      >
                                        <Trash2 size={18} />
                                      </ActionIcon>
                                    </div>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </aside>

        {/* Center stage — the flipbook */}
        <section className={styles.stage}>
          {images.length > 0 ? (
            <>
              <div className={styles.stageInner}>
                <div className={styles.previewScale}>
                  <PageFlipper
                    key={flipbookKey}
                    images={images}
                    {...form.settings}
                  />
                </div>
              </div>
              <span className={styles.stageCaption}>
                <BookOpenText size={14} /> Live preview · {pages.length}{" "}
                {pageLabel}
              </span>
            </>
          ) : (
            <div className={styles.emptyStage}>
              <Images size={40} />
              <Text fw={600}>No pages yet</Text>
              <Text size="sm">
                Upload images or add one by URL from the Pages panel to preview
                your flipbook here.
              </Text>
            </div>
          )}
        </section>

        {/* Right toolbar — settings */}
        <aside className={styles.panel}>
          <Accordion
            multiple
            defaultValue={["behavior", "layout", "animation"]}
          >
            <Accordion.Item value="behavior">
              <Accordion.Control icon={<SlidersHorizontal size={16} />}>
                Behavior
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  {renderSwitch("Draw shadow", "drawShadow")}
                  {renderSwitch("Use portrait", "usePortrait")}
                  {renderSwitch("Auto size", "autoSize")}
                  {renderSwitch("Show cover", "showCover")}
                  {renderSwitch("Mobile scroll support", "mobileScrollSupport")}
                  {renderSwitch("Show page numbers", "showPageNumbers")}
                  {renderSwitch("Show page corners", "showPageCorners")}
                  {renderSwitch("Disable flip by click", "disableFlipByClick")}
                  {renderSwitch("Use mouse events", "useMouseEvents")}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="layout">
              <Accordion.Control icon={<BookOpenText size={16} />}>
                Size &amp; layout
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Select
                    label="Size"
                    data={[
                      { value: "fixed", label: "Fixed" },
                      { value: "stretch", label: "Stretch" },
                    ]}
                    value={form.settings.size}
                    onChange={(val) => handleChange("size", val)}
                  />
                  <Group grow>
                    <NumberInput
                      label="Width"
                      value={form.settings.width}
                      onChange={(val) => handleChange("width", val)}
                    />
                    <NumberInput
                      label="Height"
                      value={form.settings.height}
                      onChange={(val) => handleChange("height", val)}
                    />
                  </Group>
                  <Group grow>
                    <NumberInput
                      label="Min width"
                      value={form.settings.minWidth}
                      onChange={(val) => handleChange("minWidth", val)}
                    />
                    <NumberInput
                      label="Max width"
                      value={form.settings.maxWidth}
                      onChange={(val) => handleChange("maxWidth", val)}
                    />
                  </Group>
                  <Group grow>
                    <NumberInput
                      label="Min height"
                      value={form.settings.minHeight}
                      onChange={(val) => handleChange("minHeight", val)}
                    />
                    <NumberInput
                      label="Max height"
                      value={form.settings.maxHeight}
                      onChange={(val) => handleChange("maxHeight", val)}
                    />
                  </Group>
                  <NumberInput
                    label="Start Z-Index"
                    value={form.settings.startZIndex}
                    onChange={(val) => handleChange("startZIndex", val)}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="animation">
              <Accordion.Control icon={<PlayCircle size={16} />}>
                Animation
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <NumberInput
                    label="Flipping time (ms)"
                    min={100}
                    max={2000}
                    step={100}
                    value={form.settings.flippingTime}
                    onChange={(val) => handleChange("flippingTime", val)}
                  />
                  <NumberInput
                    label="Swipe distance"
                    min={10}
                    max={100}
                    value={form.settings.swipeDistance}
                    onChange={(val) => handleChange("swipeDistance", val)}
                  />
                  <NumberInput
                    label="Max shadow opacity"
                    min={0}
                    max={1}
                    step={0.1}
                    value={form.settings.maxShadowOpacity}
                    onChange={(val) => handleChange("maxShadowOpacity", val)}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </aside>
      </div>
    </form>
  );
}

export const defaultFlipbookValues: FlipbookFormValues = {
  slug: "",
  title: "",
  description: "",
  images: [],
  published: false,
  settings: {
    width: 400,
    height: 600,
    size: "stretch",
    minWidth: 315,
    maxWidth: 1000,
    minHeight: 400,
    maxHeight: 1500,
    drawShadow: true,
    flippingTime: 600,
    usePortrait: true,
    startZIndex: 0,
    autoSize: true,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: true,
    showPageNumbers: true,
    swipeDistance: 30,
    showPageCorners: true,
    disableFlipByClick: false,
    useMouseEvents: true,
  },
};
