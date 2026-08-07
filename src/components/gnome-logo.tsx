/**
 * Логотип: гномик с волшебной палочкой. Нарисован SVG, а не картинкой,
 * чтобы одинаково выглядеть в светлой и тёмной теме и не терять чёткость.
 * Формы намеренно крупные и простые — иконка показывается размером ~36px,
 * мелкие детали на таком размере превращаются в кашу.
 * Анимация отключается при системной настройке «уменьшить движение».
 */
export function GnomeLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width="36"
      height="36"
      className={className}
      role="img"
      aria-label="Быстрый помощник"
    >
      <g className="gnome-bob">
        {/* Борода светло-серая с контуром: чисто белая сливалась бы
            со светлой шапкой сайта и была бы не видна. */}
        <path
          d="M6 16 Q5 31 15 37 Q25 31 24 16 Z"
          fill="#eaeef5"
          stroke="#b6c1d4"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />

        {/* нос */}
        <circle cx="15" cy="20.5" r="3.3" fill="#efac7d" />

        {/* колпак */}
        <path d="M15 2 L24 14 L6 14 Z" fill="#d64545" />
        <path d="M15 2 L19.5 8 L10.5 8 Z" fill="#e8706e" />
        {/* поля колпака — надвинуты на глаза, как у классического гнома */}
        <rect x="4.5" y="13" width="21" height="3.8" rx="1.9" fill="#b83838" />
      </g>

      {/* волшебная палочка */}
      <g className="gnome-wand">
        <line
          x1="27"
          y1="35"
          x2="34"
          y2="25"
          stroke="#9a6633"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <g className="gnome-sparkle">
          <path
            d="M35 17 L36.6 21 L40 22.6 L36.6 24.2 L35 28 L33.4 24.2 L30 22.6 L33.4 21 Z"
            fill="#ffcf4d"
          />
        </g>
      </g>
    </svg>
  );
}
