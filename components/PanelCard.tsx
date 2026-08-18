import PersonPhoto from "./PersonPhoto";
import type { PanelMember } from "@/lib/contestants";

export default function PanelCard({ member }: { member: PanelMember }) {
  return (
    <div className="w-[200px] shrink-0 snap-start text-center">
      <PersonPhoto
        src={member.image_url}
        name={member.name}
        className="w-[200px] h-[200px] mx-auto"
        rounded="rounded-full"
      />
      <h3 className="font-display text-[24px] leading-none text-ink uppercase mt-4">
        {member.name}
      </h3>
      <p className="font-body text-[16px] text-ink mt-1">{member.role}</p>
    </div>
  );
}
