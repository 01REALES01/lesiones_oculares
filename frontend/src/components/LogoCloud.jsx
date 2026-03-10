import { InfiniteSlider } from './InfiniteSlider';

export function LogoCloud({ className, logos }) {
    return (
        <div className={`logo-cloud ${className || ''}`}>
            <InfiniteSlider gap={56} reverse speed={80} speedOnHover={25}>
                {logos.map((logo) => (
                    <img
                        alt={logo.alt}
                        className="logo-cloud-img"
                        height={logo.height || 'auto'}
                        key={`logo-${logo.alt}`}
                        loading="lazy"
                        src={logo.src}
                        width={logo.width || 'auto'}
                    />
                ))}
            </InfiniteSlider>
        </div>
    );
}
