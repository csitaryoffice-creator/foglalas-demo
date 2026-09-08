export default function CsitaryMark({ inverse = false, compact = false }) {
  return (
    <a
      className={`csitary-mark ${inverse ? "csitary-mark--inverse" : ""}`}
      href="https://csitaryoffice.hu/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Csitáry Office weboldalának megnyitása"
    >
      <img className="csitary-mark__logo" src="/assets/brand/csitary-office-logo.png" alt="" aria-hidden="true" />
      {!compact && <span className="csitary-mark__name">Csitáry Office</span>}
    </a>
  );
}
