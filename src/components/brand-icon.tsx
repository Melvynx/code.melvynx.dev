import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandIconProps = {
  className?: string;
  priority?: boolean;
};

export function BrandIcon({ className, priority = false }: BrandIconProps) {
  return (
    <Image
      src="/icon-192.png"
      alt=""
      width={32}
      height={32}
      priority={priority}
      aria-hidden="true"
      className={cn("size-7 rounded-[7px] shadow-sm", className)}
    />
  );
}
