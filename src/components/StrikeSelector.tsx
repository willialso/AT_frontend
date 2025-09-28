import React from 'react';
import styled from 'styled-components';

const StrikeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-panel);
  border-radius: 8px;
  border: 1px solid var(--border);
`;

const StrikeDisplay = styled.div`
  text-align: center;
`;

const StrikeTitle = styled.h4`
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const CurrentStrike = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
`;

const DeltaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
`;

const DeltaButton = styled.button<{ active: boolean }>`
  padding: 0.75rem;
  border: 1px solid var(--border);
  background: ${props => props.active ? 'var(--accent)' : 'var(--bg-button)'};
  color: ${props => props.active ? '#000' : 'var(--text)'};
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active ? 'var(--accent)' : 'var(--bg-button-hover)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CurrentPriceDisplay = styled.p`
  font-size: 0.875rem;
  color: var(--text-dim);
  text-align: center;
  margin-bottom: 1rem;
`;

interface StrikeSelectorProps {
  currentPrice: number;
  selectedStrike: number;
  onStrikeSelect: (strike: number) => void;
}

export const StrikeSelector: React.FC<StrikeSelectorProps> = ({
  currentPrice,
  selectedStrike,
  onStrikeSelect
}) => {
  // ✅ PROFESSIONAL: Updated delta options for new strike ranges
  const deltaOptions = [2.50, 5.00, 10.00, 15.00];

  return (
    <StrikeContainer>
      <StrikeDisplay>
        <StrikeTitle>Strike Price</StrikeTitle>
        <CurrentStrike>${selectedStrike.toFixed(2)}</CurrentStrike>
      </StrikeDisplay>
      
      <CurrentPriceDisplay>
        Current BTC: ${currentPrice.toFixed(2)}
      </CurrentPriceDisplay>
      
      <DeltaGrid>
        {deltaOptions.map(delta => (
          <React.Fragment key={delta}>
            <DeltaButton
              active={selectedStrike === Math.round((currentPrice - delta) * 100) / 100}
              onClick={() => onStrikeSelect(Math.round((currentPrice - delta) * 100) / 100)}
            >
              -${delta.toFixed(2)}
            </DeltaButton>
            <DeltaButton
              active={selectedStrike === Math.round((currentPrice + delta) * 100) / 100}
              onClick={() => onStrikeSelect(Math.round((currentPrice + delta) * 100) / 100)}
            >
              +${delta.toFixed(2)}
            </DeltaButton>
          </React.Fragment>
        ))}
      </DeltaGrid>
    </StrikeContainer>
  );
};
