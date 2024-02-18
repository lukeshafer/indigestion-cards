import { SolidMarkdown } from 'solid-markdown';
import { createSignal } from 'solid-js';
import { Form, SubmitButton, TextArea } from './form/Form';
import { API } from '@/constants';

export default function FAQEditor(props: { faq: string }) {
  const [content, setContent] = createSignal(props.faq);

  return (
    <Form method="patch" action={API.FAQ}>
      <div class="font-mono w-full">
        <TextArea
          label=""
          name="content"
          height="30rem"
          setValue={setContent}
        >{content()}</TextArea>
      </div>
      <SubmitButton disabled={content() === props.faq}>Save</SubmitButton>
      <article class="prose prose-h2:uppercase prose-h2:text-center prose-h2:text-gray-600 dark:prose-h2:text-gray-300 prose-h2:font-bold prose-h2:text-3xl prose-h3:font-heading prose-h3:text-2xl prose-h3:font-semibold prose-h3:text-gray-700 dark:prose-h3:text-gray-200 dark:prose-strong:text-white dark:prose-strong:font-bold prose-a:text-blue-900 dark:prose-a:text-blue-100 mx-auto max-w-3xl text-lg text-gray-900 dark:text-gray-100">
        <SolidMarkdown>{content()}</SolidMarkdown>
      </article>
    </Form>
  );
}
