// Бейдж корпоративного университета в шапке. Сделан HTML/SVG (не картинкой),
// чтобы цвет фона и читаемость текста настраивались через код, а не через
// повторное сохранение изображения.
export function CorporateLogoBadge() {
  return (
    <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-br from-[#6badf7] to-[#3a7ff0] px-3 py-1.5 shadow-sm sm:flex">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M12.8 3.2c.6 1.1.3 2.3-.5 3.1 1.1-.1 2.1.4 2.5 1.4-1.3.5-2.5 0-3.1-.7-.2.9-1.1 1.6-1.1 1.6s.1-1.2-.3-2.1c-.9-.4-1.4-1.4-1.1-2.5.9.3 1.6 1 1.9 1.7.1-1.1.5-2 1.7-2.5z"
          fill="white"
        />
        <path
          d="M12 8.3c-4 0-6.8 2.6-6.8 6.8 0 3.9 2.9 6.7 5.3 6.7.9 0 1.4-.4 1.5-.4.1 0 .6.4 1.5.4 2.4 0 5.3-2.8 5.3-6.7 0-1-.2-1.9-.5-2.6-1.5 1.5-3.7 1.9-5.6.9 1.7-.6 3.2-1.7 3.7-3.3-1.1-.5-2.4-.8-4.4-.8z"
          fill="white"
        />
      </svg>
      <div className="flex flex-col leading-[1.05] text-white">
        <span className="text-[8px] font-extrabold tracking-wide">KAZAKHTELECOM</span>
        <span className="text-[8px] font-extrabold tracking-wide">CORPORATE</span>
        <span className="text-[8px] font-extrabold tracking-wide">UNIVERSITY</span>
      </div>
    </div>
  );
}
