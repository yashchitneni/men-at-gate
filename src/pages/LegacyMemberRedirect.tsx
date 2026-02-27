import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useBrotherhoodProfileByProfileId } from "@/hooks/useSpotlights";

export default function LegacyMemberRedirect() {
  const { id = "" } = useParams<{ id: string }>();
  const { data, isLoading } = useBrotherhoodProfileByProfileId(id || null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (data?.slug) {
    return <Navigate to={`/brotherhood/${data.slug}`} replace />;
  }

  return <Navigate to="/brotherhood" replace />;
}
