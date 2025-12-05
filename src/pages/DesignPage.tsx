import DesignSystemShowcase from "../components/DesignSystemShowcase";
import { useNavigate } from "react-router-dom";

export default function DesignPage() {
  const navigate = useNavigate();
  return <DesignSystemShowcase onClose={() => navigate(-1)} />;
}
