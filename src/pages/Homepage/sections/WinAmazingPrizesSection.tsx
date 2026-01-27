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
    <section className="py-24 px-6">
      <div className="max-w-[1300px] mx-auto">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ fontFamily: "'Baloo Chettan 2', sans-serif", color: '#000000' }}>
            Win amazing prizes<br />
            at unbeatable odds
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#666666' }}>
            Real families winning real prizes every week. Affordable entry prices with genuine chances to win premium baby gear.
          </p>
        </div>

        {/* Videos Grid - Desktop */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          {videoTestimonials.map((card, index) => (
            <div key={index} className="relative aspect-9/16 rounded-3xl overflow-hidden shadow-xl">
              <video
                src={card.video}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-sm italic mb-2">"{card.quote}"</p>
                <p className="text-xs font-semibold">{card.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Video Carousel - Mobile */}
        <div className="md:hidden relative">
          <div className="relative aspect-9/16 rounded-3xl overflow-hidden shadow-xl max-w-sm mx-auto">
            <video
              src="https://res.cloudinary.com/dkew5dwgo/video/upload/v1768531254/Untitled_design_jiwqlw.mp4"
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-sm italic mb-2">"The instant win feature is amazing - I couldn't believe it when I won!"</p>
              <p className="text-xs font-semibold">Happy Winner</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
