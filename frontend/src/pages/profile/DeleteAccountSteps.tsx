import { Button } from "@/components/common/Button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/common/InputOTP";
import { useAppI18n } from "@/hooks/useAppI18n";
import { OTP_REGEX } from "@/utils/ValidationUtils";
import { formatTime } from "@/utils/profileUtils";

export const CONDITION_KEYS = [
    "deleteAccount.conditions.permanent",
    "deleteAccount.conditions.featureLoss",
    "deleteAccount.conditions.ssoNoRecreate",
    "deleteAccount.conditions.contentLoss",
    "deleteAccount.conditions.dataRetention",
    "deleteAccount.conditions.noRestore",
    "deleteAccount.conditions.understand",
] as const;

interface ConsentStepProps {
    email: string | undefined;
    checkedConditions: Record<string, boolean>;
    toggleCondition: (key: string) => void;
    allConditionsAccepted: boolean;
    isSending: boolean;
    errorMessage: string;
    onSendOtp: () => void;
    onCancel: () => void;
}

export const ConsentStep = ({
    email,
    checkedConditions,
    toggleCondition,
    allConditionsAccepted,
    isSending,
    errorMessage,
    onSendOtp,
    onCancel,
}: ConsentStepProps) => {
    const { t } = useAppI18n();
    return (
        <div className="space-y-4">
            <p className="text-base font-semibold text-sunbird-obsidian font-rubik">
                {t("deleteAccount.consentIntro")}
            </p>
            <ul className="space-y-2">
                {CONDITION_KEYS.map((key) => (
                    <li key={key} className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id={key}
                            checked={!!checkedConditions[key]}
                            onChange={() => toggleCondition(key)}
                            className="mt-1 accent-sunbird-brick"
                        />
                        <label htmlFor={key} className="text-base font-rubik">
                            {t(key)}
                        </label>
                    </li>
                ))}
            </ul>

            <div className="text-base text-sunbird-gray-4a font-rubik">
                {t("deleteAccount.emailLabel")}: <strong>{email || "—"}</strong>
            </div>

            {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="w-full sm:w-auto"
                    data-edataid="delete-account-cancel"
                >
                    {t("cancel")}
                </Button>
                <Button
                    onClick={onSendOtp}
                    disabled={!allConditionsAccepted || !email || isSending}
                    className="w-full sm:w-auto bg-sunbird-brick hover:bg-sunbird-brick/90 text-white"
                    data-edataid="delete-account-send-otp"
                >
                    {isSending ? t("deleteAccount.sending") : t("deleteAccount.sendOtp")}
                </Button>
            </div>
        </div>
    );
};

interface OtpStepProps {
    email: string | undefined;
    otp: string;
    setOtp: (v: string) => void;
    resendCounter: number;
    resendDisabled: boolean;
    submitting: boolean;
    errorMessage: string;
    onResend: () => void;
    onConfirm: () => void;
    onBack: () => void;
}

export const OtpStep = ({
    email,
    otp,
    setOtp,
    resendCounter,
    resendDisabled,
    submitting,
    errorMessage,
    onResend,
    onConfirm,
    onBack,
}: OtpStepProps) => {
    const { t } = useAppI18n();
    return (
        <div className="space-y-5">
            <p className="text-base text-sunbird-obsidian font-rubik">
                {t("deleteAccount.otpPrompt", { email })}
            </p>

            <div className="flex items-center justify-center mb-4">
                <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(v) => setOtp(v.replace(/[^0-9]/g, ""))}
                    pattern="^[0-9]*$"
                    inputMode="numeric"
                >
                    <InputOTPGroup className="gap-1.5 sm:gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot
                                key={i}
                                index={i}
                                className="w-9 h-10 text-base sm:w-12 sm:h-12 sm:text-lg md:w-[50px] md:h-[50px] md:text-[18px] font-semibold border border-[hsl(var(--sunbird-gray-d9))] rounded-[10px] font-rubik focus:border-[hsl(var(--sunbird-ginger))] focus:ring-1 focus:ring-[hsl(var(--sunbird-ginger))]"
                            />
                        ))}
                    </InputOTPGroup>
                </InputOTP>
            </div>

            <div className="flex items-center justify-center gap-2 mt-1 text-[13px] font-rubik mb-6">
                <span className="text-[hsl(var(--sunbird-obsidian))] font-medium">
                    {formatTime(resendCounter)}
                </span>
                <button
                    type="button"
                    onClick={onResend}
                    disabled={resendDisabled}
                    className="text-[hsl(var(--sunbird-brick))] hover:text-[hsl(var(--sunbird-brick)/0.8)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t("deleteAccount.resend")}
                </button>
            </div>

            {errorMessage && (
                <p className="text-red-600 text-sm text-center">{errorMessage}</p>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-center pt-2">
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                >
                    {t("back")}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={!OTP_REGEX.test(otp) || submitting}
                    className="w-full sm:w-auto bg-sunbird-brick hover:bg-sunbird-brick/90 text-white"
                    data-edataid="delete-account-confirm"
                >
                    {submitting ? t("deleteAccount.deleting") : t("deleteAccount.confirm")}
                </Button>
            </div>
        </div>
    );
};
