export function KoFiWidget() {
  return (
    <div>
      <iframe
        id="kofiframe"
        src="https://ko-fi.com/klados/?hidefeed=true&widget=true&embed=true&preview=true"
        style={{
          border: "none",
        }}
        width="500"
        height="700"
        title="klados"
      ></iframe>
    </div>
  );
}
