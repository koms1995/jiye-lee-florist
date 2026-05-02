export default function NameLayer() {
  return (
    <div
      className="fixed pointer-events-none select-none"
      style={{
        left: '5rem',
        top: '5rem',
        zIndex: 500,
      }}
    >
      <h1
        className="font-serif"
        style={{
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: '15vw',
          lineHeight: 0.8,
          letterSpacing: '-0.04em',
          color: '#D8A9AC',
        }}
      >
        Jiye
        <br />
        Lee
      </h1>
    </div>
  )
}
