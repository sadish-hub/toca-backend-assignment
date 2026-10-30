import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePackDto } from './create-pack.dto.js';

describe('CreatePackDto', () => {
  const base = {
    id: 'pack.school',
    packName: 'The School Pack',
    active: true,
    price: 10,
  };

  it('rejects empty-string content ids', async () => {
    const dto = plainToInstance(CreatePackDto, {
      ...base,
      content: [''],
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('rejects empty-string childPackIds', async () => {
    const dto = plainToInstance(CreatePackDto, {
      ...base,
      childPackIds: [''],
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'childPackIds')).toBe(true);
  });

  it('accepts non-empty content and childPackIds', async () => {
    const dto = plainToInstance(CreatePackDto, {
      ...base,
      content: ['furniture.desk'],
      childPackIds: ['pack.classroom'],
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });
});
