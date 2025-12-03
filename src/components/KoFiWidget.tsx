const KOFI_WIDGET_HTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://storage.ko-fi.com/cdn/widget/Widget_2.js"></script>
  </head>
  <body>
    <script>
      kofiwidget2.init('Support Klados on Ko-fi', '#46a758', 'T6T1U20P7');
      kofiwidget2.draw();
    </script>
  </body>
</html>
`;

export function KoFiWidget() {
  return (
    <iframe
      title="Support Klados on Ko-fi"
      srcDoc={KOFI_WIDGET_HTML}
      sandbox="allow-scripts allow-popups allow-top-navigation-by-user-activation"
      style={{
        border: "none",
        width: "100%",
        height: "120px",
        overflow: "hidden",
      }}
      loading="lazy"
    />
  );
}
