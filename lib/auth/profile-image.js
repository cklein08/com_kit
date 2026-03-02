/**
 * Profile image URL – IMS picture first, then Gravatar from email.
 * Matches awesomeportal's profileImage.ts.
 */
import md5 from "md5";

export function getProfilePictureUrl(profile) {
  if (!profile) return "";
  const fromProfile =
    profile.picture ??
    profile.avatar ??
    profile.user_image ??
    profile.profile_image ??
    profile.image ??
    profile.profile?.picture ??
    profile.profile?.avatar ??
    profile.imsProfile?.picture ??
    "";
  if (fromProfile) return fromProfile;
  const email = profile.email?.trim().toLowerCase();
  if (email) {
    return `https://www.gravatar.com/avatar/${md5(email)}?s=48&d=identicon`;
  }
  return "";
}
