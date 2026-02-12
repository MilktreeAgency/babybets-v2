export default function WinAmazingPrizesSection() {
  const videoTestimonials = [
    {
      video: "https://res.cloudinary.com/dkew5dwgo/video/upload/v1768531254/Untitled_design_jiwqlw.mp4",
      quote: "The instant win feature is amazing - I couldn't believe it when I won!",
      name: "Happy Winner"
    },
    {
      video: "https://res.cloudinary.com/dkew5dwgo/video/upload/v1768531246/Untitled_design_1_g8expr.mp4",
      quote: "Such great prizes and the whole experience is so easy and fun.",
      name: "Delighted Parent"
    },
    {
      video: "https://res.cloudinary.com/dkew5dwgo/video/upload/v1768530339/ugc-1_htgxzf.mp4",
      quote: "BabyBets is serving us so we can serve our little ones with the best gear.",
      name: "Sarah Dengate"
    },
    {
      video: "https://res.cloudinary.com/dkew5dwgo/video/upload/v1768530338/ugc-4_ix3qkq.mp4",
      quote: "It's a trusted platform that helps us afford premium nursery essentials.",
      name: "David Mitchell"
    }
  ]

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Headline */}
        <div className="text-center mb-10 sm:mb-12 md:mb-14 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 max-w-6xl mx-auto px-4" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
            Win amazing prizes
            at unbeatable odds
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto px-4" style={{ color: '#666666' }}>
            Real families winning real prizes every week. Affordable entry prices with genuine chances to win premium baby gear.
          </p>
        </div>

        {/* Videos Grid - Desktop/Tablet */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {videoTestimonials.map((card, index) => (
            <div key={index} className="relative aspect-9/16 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
              <video
                src={card.video}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 text-white">
                <p className="text-xs sm:text-sm italic mb-1.5 sm:mb-2">"{card.quote}"</p>
                <p className="text-[10px] sm:text-xs font-semibold">{card.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Video Carousel - Mobile */}
        <div className="sm:hidden relative">
          <div className="relative aspect-9/16 rounded-2xl overflow-hidden shadow-xl max-w-xs mx-auto">
            <video
              src="https://res.cloudinary.com/dkew5dwgo/video/upload/v1768531254/Untitled_design_jiwqlw.mp4"
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <p className="text-sm italic mb-2">"The instant win feature is amazing - I couldn't believe it when I won!"</p>
              <p className="text-xs font-semibold">Happy Winner</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
