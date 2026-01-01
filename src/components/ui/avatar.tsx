import { ImgHTMLAttributes, forwardRef } from "react";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: AvatarSize;
  fallback?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ size = "md", src, alt, fallback, className = "", ...props }, ref) => {
    const initials = fallback
      ? fallback
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

    return (
      <div
        ref={ref}
        className={`
          relative inline-flex items-center justify-center overflow-hidden
          rounded-full bg-gray-200 dark:bg-gray-700
          ${sizeStyles[size]}
          ${className}
        `}
      >
        {src ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
            {...props}
          />
        ) : (
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {initials}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
