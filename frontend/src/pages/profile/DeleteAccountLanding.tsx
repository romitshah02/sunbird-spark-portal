import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useIsAuthenticated } from "@/hooks/useAuthInfo";
import PageLoader from "@/components/common/PageLoader";

const DELETE_ACCOUNT_PATH = "/profile/delete-account";

const DeleteAccountLanding = () => {
    const { t } = useAppI18n();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useIsAuthenticated();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate(DELETE_ACCOUNT_PATH, { replace: true });
        }
    }, [isLoading, isAuthenticated, navigate]);

    const handleLogin = () => {
        const returnTo = encodeURIComponent(DELETE_ACCOUNT_PATH);
        window.location.href = `/portal/login?prompt=none&returnTo=${returnTo}`;
    };

    if (isLoading || isAuthenticated) {
        return (
            <main className="profile-main-content delete-account-main bg-white">
                <PageLoader fullPage={false} />
            </main>
        );
    }

    return (
        <main className="profile-main-content delete-account-main bg-white">
            <div className="delete-account-page text-center">
                <div className="flex justify-center mb-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <FiAlertCircle className="h-6 w-6" aria-hidden="true" />
                    </span>
                </div>
                <h1 className="delete-account-title text-center">
                    {t("deleteAccountLanding.title")}
                </h1>
                <p className="text-base font-rubik text-sunbird-gray-4a mb-6">
                    {t("deleteAccountLanding.message")}
                </p>
                <button
                    type="button"
                    onClick={handleLogin}
                    className="font-rubik font-medium text-[1rem] leading-normal h-[2.5rem] px-6 rounded-[0.375rem] bg-sunbird-brick text-white hover:opacity-90 transition-opacity inline-flex items-center justify-center"
                    data-edataid="delete-account-landing-login"
                >
                    {t("deleteAccountLanding.loginCta")}
                </button>
            </div>
        </main>
    );
};

export default DeleteAccountLanding;
