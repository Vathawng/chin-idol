const PLATFORM = process.env.NEXT_PUBLIC_STREAM_PLATFORM; // "youtube" | "facebook"
const YOUTUBE_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
const FACEBOOK_VIDEO_URL = process.env.NEXT_PUBLIC_FACEBOOK_VIDEO_URL;

export default function LiveStreamPlayer() {
  if (PLATFORM === "youtube" && YOUTUBE_CHANNEL_ID) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden card-border bg-ink">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/live_stream?channel=${YOUTUBE_CHANNEL_ID}&autoplay=1`}
          title="Chin American Idol — Live on YouTube"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (PLATFORM === "facebook" && FACEBOOK_VIDEO_URL) {
    const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      FACEBOOK_VIDEO_URL
    )}&show_text=false&autoplay=true`;
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden card-border bg-ink">
        <iframe
          className="w-full h-full"
          src={src}
          title="Chin American Idol — Live on Facebook"
          style={{ border: "none", overflow: "hidden" }}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-lg flex items-center justify-center bg-ink text-white/50 card-border font-body">
      No stream configured yet.
    </div>
  );
}