type LogoProps = {
  className?: string;
  /** حجم أصغر للشريط المضغوط */
  compact?: boolean;
  footer?: boolean;
  /** حجم أكبر (مثل عمود التذييل) */
  large?: boolean;
  /** للخلفيات الداكنة (التذييل): توهج خفيف فاتح بدل ظل أسود يبدو كإطار */
  light?: boolean;
};

export function Logo({ className = "", compact, large, light, footer }: LogoProps) {
  const logoSrc = footer ? '/Urgen_Logo_White_Text.png' : '/urgen_logo_2.png'
  const sizeClass = compact
    ? "h-9 w-auto sm:h-10"
    : large
      ? "h-36 w-auto sm:h-36 md:h-36"
      : "h-19 w-auto sm:h-19 md:h-19";

  const maxWClass = large
    ? "max-w-[min(100%,360px)]"
    : "max-w-[min(100%,240px)]";

  return (
    <span className={`inline-flex items-center  ${className}`}>
      <img
        src={logoSrc}
        alt="URGEN Laboratory — مختبر التحليلات الوراثية"
        className={`${sizeClass} ${maxWClass} border-0 object-contain outline-none ring-0 [image-rendering:auto] ${
          light ? "drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]" : ""
        } `}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
