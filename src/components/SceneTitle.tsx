interface SceneTitleProps {
  kicker: string;
  title: string;
  question: string;
  index?: string;
}

export default function SceneTitle({ kicker, title, question, index }: SceneTitleProps) {
  return (
    <header className="scene-title-block">
      {index ? <span className="scene-title-index">{index}</span> : null}
      <div>
        <span className="scene-title-kicker">{kicker}</span>
        <h1>{title}</h1>
        <p>{question}</p>
      </div>
    </header>
  );
}
