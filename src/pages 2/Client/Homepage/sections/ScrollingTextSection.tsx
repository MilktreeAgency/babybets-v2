export default function ScrollingTextSection() {
  return (
    <section
      className="py-5 overflow-hidden my-20 md:my-[120px]"
      style={{ backgroundColor: '#ffca24' }}
    >
      <div className="flex animate-scroll whitespace-nowrap">
        {[...Array(10)].map((_, index) => (
          <div key={index} className="flex items-center shrink-0 mx-5 md:mx-10">
            <span className="text-lg md:text-xl font-bold text-black">
              Ready to find something special for your little one?
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
