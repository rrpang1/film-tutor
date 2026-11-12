import { defaultPack } from "@/lib/packs";
import FrameView from "./FrameView";

export function generateStaticParams() {
  return defaultPack.nodes.map((n) => ({ id: n.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FrameView id={id} />;
}
