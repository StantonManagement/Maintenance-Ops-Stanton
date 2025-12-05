import FutureFeatures from "../components/FutureFeatures";
import { useNavigate } from "react-router-dom";

export default function FuturePage() {
  const navigate = useNavigate();
  return <FutureFeatures onClose={() => navigate(-1)} />;
}
