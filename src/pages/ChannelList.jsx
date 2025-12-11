export default function ChannelList({ item, focuse }) {
  return (
    <div
      className={`
        channel-card
        relative
        min-w-[230px] h-[120px]
        rounded-2xl
        bg-center bg-cover
        flex-shrink-0
        cursor-pointer
        transition-all duration-300 ease-out

        ${focuse
          ? "scale-110 ring-4 ring-white opacity-100 z-50 ring-breathe"
          : "scale-100 opacity-70 z-10"}
      `}
      style={{ backgroundImage: `url(${item.logo})` }}
    />
  );
}
