import { ModelTestExperience } from "@/components/model-tests/experience";

export default async function ModelTestSuitePage({
  params,
}: {
  params: Promise<{ suiteId: string }>;
}) {
  const { suiteId } = await params;
  return <ModelTestExperience suiteId={suiteId} />;
}
