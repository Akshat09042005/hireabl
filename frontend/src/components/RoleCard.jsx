function RoleCard({ title, selected, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      className={`w-full py-[14px] px-[20px] border rounded-[8px] cursor-pointer transition-all duration-200 ease-in-out flex justify-start items-center gap-[12px] group
        ${selected 
          ? 'border-[#2563eb] bg-[#eff6ff]' 
          : 'border-[#e5e7eb] bg-white hover:border-[#2563eb] hover:bg-[#f8fafc]'
        }`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {Icon && (
        <Icon 
          className={`transition-colors duration-200 ease-in-out shrink-0
            ${selected ? 'text-[#2563eb]' : 'text-[#6b7280] group-hover:text-[#2563eb]'}`} 
          size={20} 
        />
      )}
      <h3 className={`text-[16px] m-0 text-left
        ${selected ? 'text-[#1e40af] font-semibold' : 'text-[#374151] font-medium'}`}
      >
        {title}
      </h3>
    </button>
  )
}

export default RoleCard
