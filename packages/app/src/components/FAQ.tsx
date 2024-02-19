import { SolidMarkdown } from 'solid-markdown';

export default function FAQ(props: { content: string }) {
  return <SolidMarkdown children={props.content} />;
}
