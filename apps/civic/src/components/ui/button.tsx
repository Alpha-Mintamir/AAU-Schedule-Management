import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-primary-700 text-white hover:bg-primary-800 focus-visible:outline-primary-700",
        secondary:
          "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 focus-visible:outline-stone-500",
        ghost: "text-stone-700 hover:bg-stone-100 focus-visible:outline-stone-500",
        danger: "bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700",
        subtle: "bg-primary-50 text-primary-800 hover:bg-primary-100 focus-visible:outline-primary-600",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
