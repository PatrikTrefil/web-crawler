import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RecordsPage from "./records/RecordsPage";
import NotFound from "./NotFound";
import PageLayout from "./PageLayout";
import ExecutionsPage from "./executions/ExecutionsPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PageLayout />}>
                    <Route
                        index
                        element={<Navigate to="/records" replace={true} />}
                    />
                    <Route path="/records" element={<RecordsPage />} />
                    <Route path="/executions" element={<ExecutionsPage />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
