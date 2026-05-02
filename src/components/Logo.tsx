type LogoProps = {
  className?: string;
  /** حجم أصغر للشريط المضغوط */
  compact?: boolean;
  /** للخلفيات الداكنة (التذييل): توهج خفيف فاتح بدل ظل أسود يبدو كإطار */
  light?: boolean;
};

const LOGO_SRC = "/urgen-logo.png";

export function Logo({ className = "", compact, light }: LogoProps) {
  const sizeClass = compact
    ? "h-9 w-auto sm:h-10"
    : "h-11 w-auto sm:h-12 md:h-14";

  return (
    <span className={`inline-flex items-center  ${className}`}>
        <img
          src={LOGO_SRC}
          alt="URGEN Laboratory — مختبر التحليلات الوراثية"
          className={`${sizeClass} max-w-[min(100%,240px)] border-0 object-contain outline-none ring-0 [image-rendering:auto] ${
            light ? "drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]" : ""
          } `}
          decoding="async"
          draggable={false}
        />
    </span>
  );
}
