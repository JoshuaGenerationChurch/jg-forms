import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            {...props}
            src="/brand/JG-Logo-Favicon-White-Blue.png"
            alt={props.alt ?? 'Joshua Generation Church'}
        />
    );
}
